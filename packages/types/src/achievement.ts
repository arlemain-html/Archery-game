export interface Achievement {
  id: string;
  title: string;
  description: string;
  criteria: Record<string, any>;
  reward: Record<string, any>;
}
