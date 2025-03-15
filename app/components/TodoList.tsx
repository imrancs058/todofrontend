'use client';

import { useEffect, useState } from 'react';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../types/todo';
import { TodoService } from '../services/TodoService';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState<{ id: string; title: string } | null>(null);
  const [todoService] = useState(() => new TodoService());

  useEffect(() => {
    // Load initial todos
    const loadTodos = async () => {
      try {
        const fetchedTodos = await todoService.getAllTodos();
        setTodos(fetchedTodos);
      } catch (error) {
        console.error('Failed to load todos:', error);
      }
    };

    loadTodos();

    // Set up real-time listeners
    todoService.onTodoCreated((newTodo) => {
      setTodos((prevTodos) => [...prevTodos, newTodo]);
    });

    todoService.onTodoUpdated((updatedTodo) => {
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === updatedTodo._id ? updatedTodo : todo
        )
      );
      if (editingTodo?.id === updatedTodo._id) {
        setEditingTodo(null);
      }
    });

    todoService.onTodoDeleted((deletedTodoId) => {
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo._id !== deletedTodoId)
      );
      if (editingTodo?.id === deletedTodoId) {
        setEditingTodo(null);
      }
    });

    // Cleanup on unmount
    return () => {
      todoService.cleanup();
    };
  }, [todoService, editingTodo?.id]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const newTodo: CreateTodoDto = {
        title: newTodoTitle.trim(),
      };
      await todoService.createTodo(newTodo);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      // Update local state immediately
      setTodos(prevTodos =>
        prevTodos.map(t =>
          t._id === todo._id ? { ...t, completed: !t.completed } : t
        )
      );
      
      // Send update to server
      await todoService.updateTodo(todo._id, {
        completed: !todo.completed,
      });
    } catch (error) {
      // Revert local state if server update fails
      setTodos(prevTodos =>
        prevTodos.map(t =>
          t._id === todo._id ? { ...t, completed: todo.completed } : t
        )
      );
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todoService.deleteTodo(todoId);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingTodo({ id: todo._id, title: todo.title });
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
  };

  const handleSaveEdit = async (todoId: string) => {
    if (!editingTodo || !editingTodo.title.trim()) return;

    try {
      // Find the current todo to preserve its completed status
      const currentTodo = todos.find(todo => todo._id === todoId);
      if (!currentTodo) return;

      const updateData: UpdateTodoDto = {
        title: editingTodo.title.trim(),
        completed: currentTodo.completed // Preserve the completed status
      };
      await todoService.updateTodo(todoId, updateData);
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-black">Todo List</h1>
      
      <form onSubmit={handleCreateTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Todo
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {todos.map((todo) => (
          <li
            key={todo._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center gap-3 flex-1">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo)}
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              {editingTodo?.id === todo._id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editingTodo.title}
                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                    className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(todo._id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className={`text-black ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.title}
                </span>
              )}
            </div>
            {!editingTodo && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartEdit(todo)}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTodo(todo._id)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 