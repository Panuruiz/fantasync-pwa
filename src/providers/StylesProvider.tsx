import { ReactNode } from "react";
import "../app/globals.css";

export const StylesProvider = ({ children }: { children: ReactNode }) => {
  return (
    <div className="styles-provider">
      {children}
    </div>
  );
};
