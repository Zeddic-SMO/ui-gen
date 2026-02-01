import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MainContent } from '../main-content';

// Mock the components that have complex dependencies
vi.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

vi.mock('@/components/editor/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock('@/components/preview/PreviewFrame', () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Frame</div>,
}));

vi.mock('@/components/HeaderActions', () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test('MainContent toggle buttons should switch between preview and code views', () => {
  render(<MainContent />);

  // Initially should show preview
  expect(screen.getByTestId('preview-frame')).toBeDefined();
  expect(screen.queryByTestId('code-editor')).toBeNull();

  // Find and click the Code tab
  const codeTab = screen.getByRole('tab', { name: /code/i });
  fireEvent.click(codeTab);

  // Should now show code view
  expect(screen.queryByTestId('preview-frame')).toBeNull();
  expect(screen.getByTestId('code-editor')).toBeDefined();
  expect(screen.getByTestId('file-tree')).toBeDefined();

  // Find and click the Preview tab
  const previewTab = screen.getByRole('tab', { name: /preview/i });
  fireEvent.click(previewTab);

  // Should show preview again
  expect(screen.getByTestId('preview-frame')).toBeDefined();
  expect(screen.queryByTestId('code-editor')).toBeNull();
});

test('MainContent toggle buttons should have correct active state', () => {
  render(<MainContent />);

  const previewTab = screen.getByRole('tab', { name: /preview/i });
  const codeTab = screen.getByRole('tab', { name: /code/i });

  // Preview should be active initially
  expect(previewTab).toHaveAttribute('data-state', 'active');
  expect(codeTab).toHaveAttribute('data-state', 'inactive');

  // Click Code tab
  fireEvent.click(codeTab);

  // Code should be active now
  expect(codeTab).toHaveAttribute('data-state', 'active');
  expect(previewTab).toHaveAttribute('data-state', 'inactive');

  // Click Preview tab again
  fireEvent.click(previewTab);

  // Preview should be active again
  expect(previewTab).toHaveAttribute('data-state', 'active');
  expect(codeTab).toHaveAttribute('data-state', 'inactive');
});
