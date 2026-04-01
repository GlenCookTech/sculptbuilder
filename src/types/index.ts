export interface Exercise {
  id: string;
  name: string;
  counts: string;
  position: number;
}

export interface Track {
  id: string;
  name: string;
  duration: number;
  muscles: string[];
  exercises: Exercise[];
  notes: string;
  position: number;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  tracks: Track[];
}

export interface RoutineSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_duration: number;
  track_count: number;
}
