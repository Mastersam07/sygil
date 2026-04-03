export function loadTodos(_claudeDir: string) {
  return { todos: [], stats: { total: 0, completed: 0, abandoned: 0, completionRate: 0 } };
}
export function loadPlans(_claudeDir: string) {
  return { plans: [] };
}
