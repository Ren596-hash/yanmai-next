// 研脉 · 通知系统
// Demo阶段内存存储，生产环境写入Supabase notifications表

export interface Notification {
  id: string;
  type: "annotation_new" | "annotation_reply" | "mentor_annotation" | "failure_match" | "capsule_ready";
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  userId?: string; // 接收者
}

// 内存存储
let notifications: Notification[] = [];

// 种子通知（Demo预置）
const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "annotation_new",
    title: "新批注回复",
    body: "陈老师回复了你在MoS₂论文上的批注",
    link: "/reader",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n2",
    type: "mentor_annotation",
    title: "导师新批注",
    body: "陈老师在Fe-N-C ORR论文上添加了批注",
    link: "/reader",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "n3",
    type: "failure_match",
    title: "风险提示",
    body: "你的实验方案与'MoS₂相变失败'案例有2个匹配点",
    link: "/advisor",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "n4",
    type: "capsule_ready",
    title: "知识胶囊已生成",
    body: "张明远的知识胶囊打包完成，可在入组培训中使用",
    link: "/capsule",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

// 初始化种子数据
if (notifications.length === 0) {
  notifications = [...SEED_NOTIFICATIONS];
}

export function getNotifications(userId?: string): Notification[] {
  if (userId) {
    return notifications
      .filter((n) => !n.userId || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadCount(userId?: string): number {
  const list = getNotifications(userId);
  return list.filter((n) => !n.isRead).length;
}

export function markAsRead(notificationId: string): void {
  const n = notifications.find((n) => n.id === notificationId);
  if (n) n.isRead = true;
}

export function markAllAsRead(userId?: string): void {
  const list = userId
    ? notifications.filter((n) => !n.userId || n.userId === userId)
    : notifications;
  list.forEach((n) => (n.isRead = true));
}

export function addNotification(
  n: Omit<Notification, "id" | "isRead" | "createdAt">
): Notification {
  const newNotif: Notification = {
    ...n,
    id: `n${Date.now()}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  return newNotif;
}
