"use client";

import React, { ViewTransition } from "react";

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <ViewTransition enter={"slide-up"} exit={"slide-down"}>
      {children}
    </ViewTransition>
  );
};
