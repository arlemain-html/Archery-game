export interface Match {
  id: string;
  players: string[];
  status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  winnerId?: string;
  startTime: Date;
  endTime?: Date;
}
