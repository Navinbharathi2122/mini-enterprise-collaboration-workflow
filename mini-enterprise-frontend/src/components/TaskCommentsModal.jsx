
import { useEffect, useState } from "react";
import {
  getTaskComments,
  addTaskComment,
} from "../services/commentService";
import { useAuth0 } from "@auth0/auth0-react";

function TaskCommentsModal({ task, closeModal }) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [role, setRole] = useState("");
  const [roleLoading, setRoleLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const normalizedRole = String(role)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const isManagerOrAdmin = [
    "admin",
    "administrator",
    "super_admin",
    "superadmin",
    "manager",
    "team_leader",
    "teamleader",
  ].includes(normalizedRole);

  // Fetch the actual role from the same API used by Sidebar/Navbar.
  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      if (authLoading) return;

      if (!isAuthenticated) {
        if (!cancelled) {
          setRole("");
          setRoleLoading(false);
        }
        return;
      }

      try {
        setRoleLoading(true);

        const token = await getAccessTokenSilently();

        const response = await fetch(
          "http://127.0.0.1:8000/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Could not fetch user role: HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setRole(data.role || "");
          console.log("Task comments API role:", data.role);
        }
      } catch (error) {
        console.error("Failed to fetch task comment role:", error);

        if (!cancelled) {
          setRole("");
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, getAccessTokenSilently]);

  // Load comments for this task.
  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      try {
        setLoading(true);

        const data = await getTaskComments(task.id);

        if (!cancelled) {
          setComments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load comments:", error);

        if (!cancelled) {
          alert(
            error.response?.data?.detail ||
              "Failed to load comments."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchComments();

    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const refreshComments = async () => {
    const data = await getTaskComments(task.id);
    setComments(Array.isArray(data) ? data : []);
  };

  const submitComment = async () => {
    if (!content.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    if (isInternal && !isManagerOrAdmin) {
      alert("Only managers and admins can create internal comments.");
      return;
    }

    try {
      setSending(true);

      await addTaskComment(task.id, {
        content: content.trim(),
        is_internal: isInternal,
      });

      setContent("");
      setIsInternal(false);

      await refreshComments();
    } catch (error) {
      console.error("Failed to post comment:", error);

      alert(
        error.response?.data?.detail ||
          "Failed to post comment."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Task Comments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {task.title}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Close comments"
            className="text-2xl text-slate-500 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="max-h-[420px] space-y-5 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-center text-slate-500">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className="text-center text-slate-500">
              No comments available.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-2xl border p-4 ${
                  comment.is_internal
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                      {(comment.user_name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {comment.user_name || "User"}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {new Date(
                          comment.created_at
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      comment.is_internal
                        ? "bg-red-600 text-white"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {comment.is_internal ? "INTERNAL" : "EXTERNAL"}
                  </span>
                </div>

                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="space-y-4 border-t px-6 py-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Comment Type
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsInternal(false)}
                aria-pressed={!isInternal}
                className={`rounded-xl border px-4 py-2 font-medium ${
                  !isInternal
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                External Comment
              </button>

              {roleLoading ? (
                <span className="px-2 py-2 text-sm text-slate-500">
                  Checking permissions...
                </span>
              ) : (
                isManagerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    aria-pressed={isInternal}
                    className={`rounded-xl border px-4 py-2 font-medium ${
                      isInternal
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Internal Comment
                  </button>
                )
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {isInternal
                ? "Internal comments are restricted to managers and admins."
                : "External comments are for normal task discussions."}
            </p>
          </div>

          <textarea
            rows={3}
            placeholder="Write your comment..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-300 px-5 py-2 font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={submitComment}
              disabled={sending || loading || roleLoading}
              className="rounded-xl bg-blue-700 px-6 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCommentsModal;
