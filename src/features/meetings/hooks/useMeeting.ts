// src/features/meetings/hooks/useMeetings.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MeetingRoom } from "@/features/meetings/types/meeting.types";

export function useMeetings(orgId: string) {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`/api/organizations/${orgId}/meetings`);
      console.log(res);
      setRooms(res.data);
    } catch (error) {
      console.log(error);
      setError("Failed to load meeting rooms");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (data: {
    name: string;
    description?: string;
    password: string;
    scheduledAt?: string;
  }) => {
    const res = await axios.post(`/api/organizations/${orgId}/meetings`, data);
    setRooms((prev) => [res.data, ...prev]);
    return res.data;
  };

  const joinRoom = async (roomId: string, password: string) => {
    await axios.post(`/api/organizations/${orgId}/meetings/${roomId}/join`, {
      password,
    });
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, hasJoined: true, participantCount: r.participantCount + 1 }
          : r,
      ),
    );
  };

  const leaveRoom = async (roomId: string) => {
    await axios.post(`/api/organizations/${orgId}/meetings/${roomId}/leave`);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              hasJoined: false,
              participantCount: Math.max(0, r.participantCount - 1),
            }
          : r,
      ),
    );
  };

  return {
    rooms,
    isLoading,
    error,
    refetch: fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
