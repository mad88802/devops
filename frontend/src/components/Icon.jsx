/**
 * One stroke icon set, drawn on a 24px grid so nothing looks borrowed from
 * three different libraries.
 */
const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M4.5 12.5 9.5 17.5 20 6.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronDown: <path d="m5.5 9 6.5 6.5L18.5 9" />,
  chevronRight: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  chevronLeft: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  arrowLeft: <path d="M19 12H5m7-7-7 7 7 7" />,
  arrowRight: <path d="M5 12h14m-7-7 7 7-7 7" />,
  alert: (
    <>
      <path d="M12 4.5 2.8 20h18.4z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.4v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8v.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 20 6v5.6c0 4.6-3.3 7.7-8 9.2-4.7-1.5-8-4.6-8-9.2V6z" />
    </>
  ),
  users: (
    <>
      <path d="M15.5 20.5v-1.4a3.6 3.6 0 0 0-3.6-3.6H6.1a3.6 3.6 0 0 0-3.6 3.6v1.4" />
      <circle cx="9" cy="7.2" r="3.4" />
      <path d="M21.5 20.5v-1.4a3.6 3.6 0 0 0-2.7-3.5" />
      <path d="M15.6 4.1a3.4 3.4 0 0 1 0 6.2" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.5A2 2 0 0 1 6 3.5h7a2 2 0 0 1 2 2V21" />
      <path d="M15 9h3a2 2 0 0 1 2 2v10" />
      <path d="M2.5 21h19" />
      <path d="M7.5 7.5h4M7.5 11.5h4M7.5 15.5h4" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 13h7M8.5 17h4.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3.2 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.6 4.4v5.2h-5.2" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16.5 4.5-4.5L16 7.5" />
      <path d="M20.5 12H9.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6.2h17" />
      <path d="M8.5 6.2V4.4a1.4 1.4 0 0 1 1.4-1.4h4.2a1.4 1.4 0 0 1 1.4 1.4v1.8" />
      <path d="M6.3 6.2 7.2 20a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.9-13.8" />
      <path d="M10.4 10.4v6.8M13.6 10.4v6.8" />
    </>
  ),
  edit: (
    <>
      <path d="M11.5 20.5H21" />
      <path d="M16.4 3.7a2.1 2.1 0 0 1 3 3L7.2 19l-4 1 1-4z" />
    </>
  ),
  flag: (
    <>
      <path d="M4.6 15.2s1-.9 3.9-.9 4.9 1.9 7.8 1.9 3.9-.9 3.9-.9V3.9s-1 .9-3.9.9-4.9-1.9-7.8-1.9-3.9.9-3.9.9z" />
      <path d="M4.6 21.4V15" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.4a13 13 0 0 1 0 17.2 13 13 0 0 1 0-17.2z" />
    </>
  ),
  activity: <path d="M21.5 12h-4l-3 8.5L9.5 3.5l-3 8.5h-4" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20" />
      <path d="M6.2 2.5H20v19H6.2A2.2 2.2 0 0 1 4 19.3V4.7a2.2 2.2 0 0 1 2.2-2.2z" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18" />
      <path d="M7.5 21h9" />
      <path d="M5 6.5h14" />
      <path d="M5 6.5 2 13a3.2 3.2 0 0 0 6 0z" />
      <path d="M19 6.5 16 13a3.2 3.2 0 0 0 6 0z" />
    </>
  ),
  filter: (
    <>
      <path d="M3.5 6h17" />
      <path d="M6.8 12h10.4" />
      <path d="M10.2 18h3.6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9z" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 12.5h4l1.5 3h6l1.5-3h4" />
      <path d="M5.6 4.5h12.8l2.1 8v5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-5z" />
    </>
  ),
}

export function Icon({ name, size = 16, strokeWidth = 1.7, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
