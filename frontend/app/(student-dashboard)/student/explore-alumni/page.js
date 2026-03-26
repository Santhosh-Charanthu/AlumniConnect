"use client";

import { useState, useEffect, useRef } from "react";
import { authFetch } from "../../../../src/services/authFetch";
import AlumniCard from "../../../components/AlumniCard";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import "./explore-alumni.css";
import Loader from "../../../components/Loader";

export default function ExploreAlumniPage() {
  const [filters, setFilters] = useState({
    name: "",
    college: "",
    company: "",
    jobTitle: "",
    skills: "",
  });
  const [sort, setSort] = useState("");
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  const debounceTimer = useRef(null);
  const mounted = useRef(false);

  const fetchAlumni = async (currentFilters, currentSort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (currentSort) params.append("sort", currentSort);

      const queryString = params.toString();
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumni/search` + (queryString ? "?" + queryString : "")
      );
      const data = await res.json();
      if (data.success) {
        setAlumni(data.alumni);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni({}, "");
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchAlumni(filters, sort);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [filters, sort]);

  if (loading) return <Loader />;

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
            onChange={(e) => setFilters({ ...filters, college: e.target.value })}
          />
          <input
            placeholder="Company"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
          />
          <input
            placeholder="Job Title"
            value={filters.jobTitle}
            onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })}
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

      {alumni.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No results found</p>
          <span>Try adjusting your filters</span>
        </div>
      ) : (
        <div className="alumni-grid">
          {alumni.map((a) => (
            <AlumniCard key={a._id} alumni={a} />
          ))}
        </div>
      )}
    </div>
  );
}
