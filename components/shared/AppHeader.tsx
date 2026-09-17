"use client";

import React from "react";
import { GlobalNavbar } from "./GlobalNavbar";

interface AppHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  showBack?: boolean;
  showDashboard?: boolean;
  backHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  icon,
  subtitle,
  badge,
  showBack = true,
  showDashboard = true,
  backHref,
  children,
  className = "",
}) => {
  return (
    <GlobalNavbar
      title={title}
      icon={icon}
      badge={badge}
      showBack={showBack}
      backHref={backHref}
      className={className}
    >
      {children}
    </GlobalNavbar>
  );
};
