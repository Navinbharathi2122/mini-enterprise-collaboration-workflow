import { useEffect, useState } from "react";
import {
  getTaskComments,
  addTaskComment,
} from "../services/commentService";

import { getUserFromToken } from "../utils/jwt";

function TaskCommentsModal({ task, closeModal }) {
  const currentUser = getUserFromToken();

  const isManagerOrAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager";

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);

      const data = await getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!content.trim()) {
      return alert("Comment cannot be empty.");
    }

    try {
      setSending(true);

      await addTaskComment(task.id, {
        content,
        is_internal: isInternal,
      });

      setContent("");
      setIsInternal(false);

      fetchComments();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">

      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Task Comments
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {task.title}
            </p>
          </div>

          <button
            onClick={closeModal}
            className="text-slate-500 hover:text-red-500 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-6 py-5 space-y-5">

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
                <div className="flex justify-between items-center mb-3">

                  <div className="flex items-center gap-3">

                    <div className="h-11 w-11 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">
                      {comment.user_name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {comment.user_name}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>

                  {comment.is_internal && (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                      INTERNAL
                    </span>
                  )}
                </div>

                <p className="text-slate-700 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border-t px-6 py-5 space-y-4">

          <textarea
            rows="3"
            placeholder="Write your comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />

          {isManagerOrAdmin && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) =>
                  setIsInternal(e.target.checked)
                }
              />

              Internal Comment (Manager/Admin only)
            </label>
          )}

          <div className="flex justify-end gap-3">

            <button
              onClick={closeModal}
              className="rounded-xl border border-slate-300 px-5 py-2 font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={submitComment}
              disabled={sending}
              className="rounded-xl bg-blue-700 px-6 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
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