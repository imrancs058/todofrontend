import axios from 'axios';
import  io  from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../types/todo';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

export class TodoService {
  private socket: any;

  constructor() {
    this.socket = io(API_URL as string);
    this.socket.emit('joinTodoRoom');
  }

  // API methods
  async getAllTodos(): Promise<Todo[]> {
    const response = await axios.get(`${API_URL}/todos`);
    return response.data;
  }

  async createTodo(todo: CreateTodoDto): Promise<Todo> {
    const response = await axios.post(`${API_URL}/todos`, todo);
    return response.data;
  }

  async updateTodo(id: string, todo: UpdateTodoDto): Promise<Todo> {
    const response = await axios.patch(`${API_URL}/todos/${id}`, todo);
    return response.data;
  }

  async deleteTodo(id: string): Promise<void> {
    await axios.delete(`${API_URL}/todos/${id}`);
  }

  // WebSocket event listeners
  onTodoCreated(callback: (todo: Todo) => void): void {
    this.socket.on('todoCreated', callback);
  }

  onTodoUpdated(callback: (todo: Todo) => void): void {
    this.socket.on('todoUpdated', callback);
  }

  onTodoDeleted(callback: (todoId: string) => void): void {
    this.socket.on('todoDeleted', callback);
  }

  // Cleanup method
  cleanup(): void {
    this.socket.disconnect();
  }
} 