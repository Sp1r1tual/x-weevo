"use client";

import { ReactNode } from "react";

import { MotionConfig } from "framer-motion";

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
};
