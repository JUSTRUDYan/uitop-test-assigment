'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, TOASTS_DURATION_SECONDS } from '@/config';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface TaskType {
  id: number;
  title: string;
  tag: Tag;
  isDone: boolean;
}

type ToastType = 'completed' | 'completedUndo' | 'deleted';

interface Toast {
  id: number;
  task: TaskType;
  type: ToastType;
  timeoutId?: NodeJS.Timeout;
  prevState?: boolean;
}

export interface ApiTag {
  id: number;
  title: string;
  color: string;
}

export interface ApiTask {
  id: number;
  title: string;
  isDone: boolean;
  tag: ApiTag;
  description?: string;
}

interface CreateTaskDto {
  title: string;
  tagId: number;
  description?: string;
}

interface CreateTagDto {
  title: string;
  color: string;
}

interface UpdateTaskDto {
  isDone: boolean;
}

export default function Index() {
  const [page, setPage] = useState<'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskType[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskType[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: tagsData } = await axios.get<ApiTag[]>(`${API_URL}/tags`);
    const loadedTags: Tag[] = tagsData.map((t) => ({ id: t.id, name: t.title, color: t.color }));
    setTags(loadedTags);

    const { data: tasksData } = await axios.get<ApiTask[]>(`${API_URL}/todos`);
    const mappedTasks = tasksData.map((t) => mapTask(t, loadedTags));
    setActiveTasks(mappedTasks.filter((t) => !t.isDone));
    setCompletedTasks(mappedTasks.filter((t) => t.isDone));
  };

  const mapTask = (task: ApiTask, tagList: Tag[]): TaskType => ({
    id: task.id,
    title: task.title,
    isDone: task.isDone,
    tag: tagList.find((tg) => tg.id === task.tag.id) ?? { id: 0, name: 'Unknown', color: '#999' },
  });

  const addToast = (toast: Toast) => setToasts((prev) => [...prev.filter((t) => t.id !== toast.id), toast]);
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const createToastTimeout = async (toast: Toast, action: () => Promise<void>) => {
    const timeoutId = setTimeout(async () => {
      removeToast(toast.id);
      await action();
    }, TOASTS_DURATION_SECONDS * 1000);
    addToast({ ...toast, timeoutId });
  };

  const deleteTask = (taskId: number) => {
    const task = [...activeTasks, ...completedTasks].find((t) => t.id === taskId);
    if (!task) return;

    const oldToast = toasts.find((t) => t.id === taskId);
    if (oldToast?.timeoutId) clearTimeout(oldToast.timeoutId);

    const prevState = activeTasks.some((t) => t.id === taskId);
    setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    setCompletedTasks((prev) => prev.filter((t) => t.id !== taskId));

    createToastTimeout(
      { id: task.id, task, type: 'deleted', prevState },
      async () => await axios.delete(`${API_URL}/todos/${taskId}`)
    );
  };

  const toggleTaskCompletion = (taskId: number, markDone: boolean) => {
    const source = markDone ? activeTasks : completedTasks;
    const targetSetter = markDone ? setCompletedTasks : setActiveTasks;
    const oppositeSetter = markDone ? setActiveTasks : setCompletedTasks;

    const task = source.find((t) => t.id === taskId);
    if (!task) return;

    oppositeSetter((prev) => prev.filter((t) => t.id !== taskId));
    targetSetter((prev) => [...prev, { ...task, isDone: markDone }]);

    const type: ToastType = markDone ? 'completed' : 'completedUndo';
    const dto: UpdateTaskDto = { isDone: markDone };

    createToastTimeout(
      { id: task.id, task, type },
      async () => await axios.patch(`${API_URL}/todos/${taskId}`, dto)
    );
  };

  const undoToast = (toastId: number) => {
    const toast = toasts.find((t) => t.id === toastId);
    if (!toast) return;
    if (toast.timeoutId) clearTimeout(toast.timeoutId);

    switch (toast.type) {
      case 'completed':
        setCompletedTasks((prev) => prev.filter((t) => t.id !== toast.task.id));
        setActiveTasks((prev) => [...prev, { ...toast.task, isDone: false }]);
        break;
      case 'completedUndo':
        setActiveTasks((prev) => prev.filter((t) => t.id !== toast.task.id));
        setCompletedTasks((prev) => [...prev, { ...toast.task, isDone: true }]);
        break;
      case 'deleted':
        (toast.prevState ? setActiveTasks : setCompletedTasks)((prev) => [...prev, toast.task]);
        break;
    }
    removeToast(toastId);
  };

  const createTask = async (title: string, tagId: number, description?: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    const dto: CreateTaskDto = { title, tagId, description };
    const { data } = await axios.post<ApiTask>(`${API_URL}/todos`, dto);

    setActiveTasks((prev) => [
      ...prev,
      { id: data.id, title: data.title, tag, isDone: data.isDone }
    ]);
  };

  const createTag = async (name: string, color: string): Promise<number> => {
    const dto: CreateTagDto = { title: name, color };
    const { data } = await axios.post<ApiTag>(`${API_URL}/tags`, dto);

    const newTag: Tag = { id: data.id, name: data.title, color: data.color };
    setTags((prev) => [...prev, newTag]);
    return newTag.id;
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Header page={page} setPage={setPage} />
      <main className="p-6">
        {page === 'active' ? (
          <ActivePage tasks={activeTasks} onComplete={(id) => toggleTaskCompletion(id, true)} onDelete={deleteTask} toasts={toasts} />
        ) : (
          <CompletedPage tasks={completedTasks} onMarkActive={(id) => toggleTaskCompletion(id, false)} onDelete={deleteTask} />
        )}
      </main>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-purple-500 text-white font-semibold py-3 px-6 rounded-lg absolute left-8 bottom-8 text-lg shadow-lg hover:bg-purple-600 transition"
      >
        + Create task
      </button>

      {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} onCreateTask={createTask} existingTags={tags} onAddTag={createTag} />}

      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
        {toasts.map((t) => <TaskToast key={t.id} toast={t} onUndo={() => undoToast(t.id)} />)}
      </div>
    </div>
  );
}

const Header = ({ page, setPage }: { page: 'active' | 'completed'; setPage: (p: 'active' | 'completed') => void }) => (
  <div className="flex w-full bg-white shadow gap-4 px-6 py-4 items-center">
    <span className="text-2xl font-semibold flex-1">ToDoS</span>
    {['active', 'completed'].map((p) => (
      <button
        key={p}
        onClick={() => setPage(p as 'active' | 'completed')}
        className={`${page === p ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-gray-100'} font-semibold py-2 px-4 rounded-lg transition`}
      >
        {p[0].toUpperCase() + p.slice(1)}
      </button>
    ))}
  </div>
);


function ActivePage({
                      tasks,
                      onComplete,
                      onDelete,
                      toasts,
                    }: {
  tasks: TaskType[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  toasts: Toast[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {tasks.length === 0 && <div className="text-center text-gray-500">🎉 No active tasks</div>}
      {tasks.map((task) => {
        const isCompleted = toasts.some((t) => t.task.id === task.id && t.type === 'completed');
        return <Task key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} isCompleted={isCompleted} />;
      })}
    </div>
  );
}

function CompletedPage({
                         tasks,
                         onMarkActive,
                         onDelete,
                       }: {
  tasks: TaskType[];
  onMarkActive: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) return <div className="text-center text-gray-500 text-lg">👀 You don't have completed tasks!</div>;

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => (
        <Task key={task.id} task={task} onComplete={() => onMarkActive(task.id)} onDelete={onDelete} isCompleted={true} />
      ))}
    </div>
  );
}

function Task({
                task,
                onComplete,
                onDelete,
                isCompleted,
              }: {
  task: TaskType;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  isCompleted: boolean;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 shadow p-3 rounded-lg hover:shadow-md bg-white transition-all">
      <button
        onClick={() => onComplete(task.id)}
        className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all duration-200 ${
          isCompleted ? 'bg-purple-500 border-purple-500' : 'border-gray-400 hover:border-purple-400'
        }`}
      >
        {isCompleted && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      <span className={`text-lg font-medium transition ${isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
      <Tag name={task.tag.name} color={task.tag.color} />
      <button
        onClick={() => onDelete(task.id)}
        className="text-red-500 hover:text-red-600 font-semibold px-2 py-1 transition"
      >
        🗑
      </button>
    </div>
  );
}

function TaskToast({ toast, onUndo }: { toast: Toast; onUndo: () => void }) {
  return (
    <div className="flex bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg items-center gap-4 animate-fadeIn">
      <span className="flex-1">{toast.task.title}</span>
      <button onClick={onUndo} className="text-yellow-400 font-semibold hover:underline">
        Undo
      </button>
    </div>
  );
}

function Tag({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold px-2 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
      <span className="w-2 h-2 rounded-full bg-white/70" />
      {name}
    </div>
  );
}


function CreateTaskModal({
                           onClose,
                           onCreateTask,
                           existingTags,
                           onAddTag,
                         }: {
  onClose: () => void;
  onCreateTask: (title: string, tagId: number) => void;
  existingTags: Tag[];
  onAddTag: (name: string, color: string) => Promise<number>;
}) {
  const [title, setTitle] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#a855f7');

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const newId = await onAddTag(newTagName, newTagColor);
    setSelectedTagId(newId);
    setIsCreatingTag(false);
    setNewTagName('');
    setNewTagColor('#a855f7');
  };

  const handleSubmit = () => {
    if (!title.trim() || !selectedTagId) return;
    onCreateTask(title, selectedTagId);
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Create new task</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {!isCreatingTag ? (
          <>
            <select
              value={selectedTagId ?? ''}
              onChange={(e) => setSelectedTagId(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="" disabled>Select tag</option>
              {existingTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
            <button onClick={() => setIsCreatingTag(true)} className="text-purple-500 font-semibold text-sm hover:underline">
              + Create new tag
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name"
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-16 h-10 p-0 border-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCreatingTag(false)} className="py-1 px-3 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-sm">Cancel</button>
              <button onClick={handleCreateTag} className="py-1 px-3 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition text-sm">Create Tag</button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !selectedTagId}
            className={`py-2 px-4 rounded-lg font-medium transition ${title.trim() && selectedTagId ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}
