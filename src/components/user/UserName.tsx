'use client';

export function UserName({ name, handle }: { name: string; handle: string }) {
  if (!handle) return <span className="printuser">{name}</span>;
  return (
    <span className="printuser w-user" data-wkt-user={handle}>
      {name}
    </span>
  );
}
