"use client";

import { useRouter } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import "./AlumniCard.css";

export default function AlumniCard({ alumni }) {
  const router = useRouter();
  const name = alumni.userId?.name || "";
  const alumniUserId = alumni.userId?._id || alumni.userId;

  const handleMessage = (e) => {
    e.stopPropagation(); // don't navigate to profile
    router.push(`/student/messages?dm=${alumniUserId}&name=${encodeURIComponent(name)}`);
  };

  return (
    <div
      className="alumni-card"
      onClick={() => router.push(`/student/alumni/${alumni._id}`)}
    >
      {alumni.profileImage?.url ? (
        <img src={alumni.profileImage.url} alt={name} className="alumni-card-img" />
      ) : (
        <div className="alumni-card-img-placeholder">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <h3 className="alumni-card-name">{name}</h3>

      <p className="alumni-card-job">
        {alumni.jobTitle} @ {alumni.company}
      </p>

      <div className="alumni-card-skills">
        {(alumni.skills || []).slice(0, 3).map((skill, i) => (
          <span key={i} className="alumni-card-skill">{skill}</span>
        ))}
      </div>

      <div className="alumni-card-rating">
        <Star size={14} />
        {alumni.rating?.toFixed(1) || "0.0"}
      </div>

      <p className="alumni-card-bio">
        {alumni.bio ? alumni.bio.slice(0, 100) + (alumni.bio.length > 100 ? "..." : "") : ""}
      </p>

      <button className="alumni-card-msg-btn" onClick={handleMessage}>
        <MessageSquare size={14} />
        Message
      </button>
    </div>
  );
}
