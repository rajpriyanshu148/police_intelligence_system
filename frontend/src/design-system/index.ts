// Design System — Central Barrel Export
// Import from here in feature pages for clean, consistent paths.

// Layout
export { AppShell } from './layout/AppShell'

// Motion Primitives
export {
  PageTransition,
  ModalTransition,
  DrawerTransition,
  HoverScale,
  ListTransition,
  ListItemTransition,
  LoadingSpinner,
  springTransition,
} from './motion/motion-primitives'

// Inputs
export { Button, Input, Select, TextArea } from './inputs/InputPrimitives'

// Display
export { Card, Badge, Timeline, TimelineItem, StatisticCard } from './display/DisplayComponents'

// Feedback
export { ToastContainer, Skeleton } from './feedback/FeedbackComponents'

// Navigation
export { Tabs, Breadcrumb, Dropdown } from './navigation/NavigationComponents'
export type { DropdownMenuItem } from './navigation/NavigationComponents'

// Shared
export { Avatar, Table, Dialog, Progress, EmptyState, Search, KPICard } from './shared/SharedComponents'
