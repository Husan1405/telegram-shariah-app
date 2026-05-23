interface Props {
  className?: string;
}

export function Skeleton({ className = '' }: Props) {
  return <div className={['skeleton rounded-xl', className].join(' ')} />;
}
