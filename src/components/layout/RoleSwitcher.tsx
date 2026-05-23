"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { UserRole } from "@/lib/types";

interface RoleState {
  role: UserRole;
  name: string;
  userId: string;
}

const ROLES: RoleState[] = [
  { role: "导师", name: "陈老师", userId: "pi-001" },
  { role: "博士", name: "张明远", userId: "phd-001" },
  { role: "硕士", name: "李华", userId: "ms-001" },
  { role: "新生", name: "赵刚", userId: "new-001" },
];

interface RoleContextType {
  currentRole: RoleState;
  allRoles: RoleState[];
  switchRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({
  currentRole: ROLES[0],
  allRoles: ROLES,
  switchRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<RoleState>(ROLES[0]);

  const switchRole = (role: UserRole) => {
    const found = ROLES.find((r) => r.role === role);
    if (found) setCurrentRole(found);
  };

  return (
    <RoleContext.Provider value={{ currentRole, allRoles: ROLES, switchRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}

export function RoleSwitcher() {
  const { currentRole, switchRole } = useRole();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">模拟视角:</span>
      <select
        value={currentRole.role}
        onChange={(e) => switchRole(e.target.value as UserRole)}
        className="text-sm bg-primary/10 text-primary border border-primary/20 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
      >
        {ROLES.map((r) => (
          <option key={r.userId} value={r.role}>
            {r.role}视角 ({r.name})
          </option>
        ))}
      </select>
    </div>
  );
}
