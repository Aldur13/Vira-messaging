import clsx from 'clsx'

function Bone({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 px-1 py-1.5">
      <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Bone className="h-3 w-24" />
        <Bone className="h-2.5 w-4/5" />
        <Bone className="h-2.5 w-3/5" />
      </div>
    </div>
  )
}

export function SkeletonMessageShort() {
  return (
    <div className="flex gap-3 px-1 py-1.5">
      <Bone className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Bone className="h-3 w-20" />
        <Bone className="h-2.5 w-2/5" />
      </div>
    </div>
  )
}

export function SkeletonMember() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Bone className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Bone className="h-2.5 w-20" />
        <Bone className="h-2 w-14" />
      </div>
    </div>
  )
}

export function SkeletonChannel() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 mx-1">
      <Bone className="w-3.5 h-3.5 rounded flex-shrink-0" />
      <Bone className="h-2.5 flex-1 max-w-[120px]" />
    </div>
  )
}
