"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-16 h-16 text-xl",
  }[size];

  // Helper to extract clean initials
  const getInitials = (name?: string, email?: string): string => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim()[0].toUpperCase();
    }
    return "U";
  };

  const initials = getInitials(user?.name, user?.email);
  const hasValidImage = Boolean(user?.avatarUrl && user.avatarUrl.trim().length > 0 && !imageError);

  if (hasValidImage) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-slate-700/50 shadow-sm ${sizeClasses} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user!.avatarUrl}
          alt={user?.name || "User profile photo"}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-label={user?.name || "User initials avatar"}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-bold select-none text-white shadow-sm bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 border border-white/20 ${sizeClasses} ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
};
