"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "../../../../src/services/authFetch";
import AlumniCard from "../../../components/AlumniCard";
import AiMatchModal from "../../../components/AiMatchModal";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import "./explore-alumni.css";
import Loader from "../../../components/Loader";

export default function ExploreAlumniPage() {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    college: "",
    company: "",
    jobTitle: "",
    skills: "",
  });
  const [sort, setSort] = useState("");
  const [alumni, setAlumni] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const debounceTimer = useRef(null);
  const abortRef = useRef(null);
  // Refs mirror state so callbacks always see current values without stale closures
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const fetchAlumni = useCallback(
    async (currentFilters, currentSort, isFirstLoad = false) => {
      // Pagination guard — skip if nothing left or already fetching
      if (!isFirstLoad && (!hasMoreRef.current || loadingRef.current)) return;

      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams();
        Object.entries(currentFilters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        if (currentSort) params.append("sort", currentSort);
        if (!isFirstLoad && cursorRef.current) {
          params.append("cursor", cursorRef.current);
        }

        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/search` +
            (params.toString() ? "?" + params.toString() : ""),
          { signal: abortRef.current.signal },
        );
        const data = await res.json();
        if (data.success) {
          if (isFirstLoad) {
            setAlumni(data.alumni);
          } else {
            // Deduplicate by _id to prevent duplicate key warnings
            setAlumni((prev) => {
              const seen = new Set(prev.map((a) => String(a._id)));
              const fresh = data.alumni.filter((a) => !seen.has(String(a._id)));
              return [...prev, ...fresh];
            });
          }
          cursorRef.current = data.nextCursor;
          hasMoreRef.current = data.hasMore;
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    fetchAlumni(filters, sort, true);
  }, []);

  // Filter / sort changes — reset everything and do a fresh load
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      cursorRef.current = null;
      hasMoreRef.current = true;
      setNextCursor(null);
      setHasMore(true);
      setAlumni([]);
      fetchAlumni(filters, sort, true);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [filters, sort]);

  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchAlumni(filters, sort, false);
        }
      },
      { threshold: 1 },
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [nextCursor, hasMore, loading]);

  if (loading && alumni.length === 0) return <Loader />;

  return (
    <div className="explore-alumni-page">
      <div className="explore-header">
        <h1>Explore Alumni</h1>
        <p>Discover mentors from your college and beyond</p>
      </div>

      <div className="explore-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div className="filters-row">
          <input
            placeholder="College"
            value={filters.college}
            onChange={(e) =>
              setFilters({ ...filters, college: e.target.value })
            }
          />
          <input
            placeholder="Company"
            value={filters.company}
            onChange={(e) =>
              setFilters({ ...filters, company: e.target.value })
            }
          />
          <input
            placeholder="Job Title"
            value={filters.jobTitle}
            onChange={(e) =>
              setFilters({ ...filters, jobTitle: e.target.value })
            }
          />
          <input
            placeholder="Skills"
            value={filters.skills}
            onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
          />
        </div>
        <div className="sort-row">
          <SlidersHorizontal size={16} />
          <span>Sort by:</span>
          <button
            className={`sort-btn ${sort === "" ? "active" : ""}`}
            onClick={() => setSort("")}
          >
            Default
          </button>
          <button
            className={`sort-btn ${sort === "rating" ? "active" : ""}`}
            onClick={() => setSort("rating")}
          >
            Highest Rating
          </button>
          <button
            className={`sort-btn ${sort === "sessions" ? "active" : ""}`}
            onClick={() => setSort("sessions")}
          >
            Most Sessions
          </button>
        </div>
      </div>

      {alumni.length === 0 && !loading ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No results found</p>
          <span>Try adjusting your filters</span>
        </div>
      ) : (
        <div className="alumni-grid">
          {alumni.map((a) => (
            <AlumniCard key={String(a._id)} alumni={a} />
          ))}
        </div>
      )}
      <div ref={observerRef}>
        {loading && alumni.length > 0 && <p>Loading...</p>}
      </div>

      {/* AI Floating Button */}
      <AiMatchModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      <button
        className="ai-fab"
        onClick={() => setAiModalOpen(true)}
        aria-label="Get AI matched alumni"
      >
        <span className="ai-fab-icon">✦</span>
        <span className="ai-fab-tooltip">
          Get suitable alumni profiles according to your interest
        </span>
      </button>
    </div>
  );
}
