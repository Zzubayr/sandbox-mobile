"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SimpleUser = { id: string; email: string; store_name?: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = q ? `/api/admin/users?q=${encodeURIComponent(q)}` : "/api/admin/users";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { load(query.trim() || undefined); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const remove = async (id: string) => {
    if (!confirm("Delete this user and their sessions? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setUsers((u) => u.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">View and delete non-admin users</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by email or store name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-72"
          />
          <Button variant="outline" onClick={() => load(query.trim() || undefined)} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={3}>Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={3}>No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 text-sm text-gray-800">{u.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{u.store_name || "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="destructive" size="sm" onClick={() => remove(u.id)} disabled={busyId === u.id}>
                      {busyId === u.id ? "Deleting…" : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
