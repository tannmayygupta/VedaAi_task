import Image from "next/image";

export function TopBar({ breadcrumb = "Exams", userName = "Madhur Rastogi" }: { breadcrumb?: string; userName?: string }) {
  return (
    <header className="flex h-14 w-full items-center gap-2.5 rounded-lg bg-surface-white/75 py-2 pl-6 pr-2">
      <button
        type="button"
        aria-label="Back"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-white"
      >
        <Image src="/illustrations/Arrow_Left-hori-nav-logo.svg" alt="" width={24} height={24} className="size-6" />
      </button>

      <div className="flex flex-1 items-center gap-2">
        <Image src="/illustrations/exams-horizontal-nav-logo.svg" alt="" width={20} height={20} className="size-5 shrink-0" />
        <span className="text-base font-semibold text-surface-disabled">{breadcrumb}</span>
      </div>

      <button type="button" aria-label="Help" className="flex size-9 items-center justify-center">
        <Image src="/illustrations/fst-nav-illustration.svg" alt="" width={36} height={36} />
      </button>
      <button type="button" aria-label="Notifications" className="flex size-9 items-center justify-center">
        <Image src="/illustrations/noti-illustration.svg" alt="" width={36} height={36} />
      </button>
      <button type="button" aria-label="AI" className="flex size-9 items-center justify-center">
        <Image src="/illustrations/gemini-illustration.svg" alt="" width={36} height={36} />
      </button>

      <div className="flex items-center gap-2 rounded-md px-3 py-1.5">
        <Image
          src="/illustrations/profile-avatar.svg"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full object-cover"
        />
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-ink-primary">{userName}</span>
          <Image
            src="/illustrations/icon-toright-of-profilename-Chevron-down.svg"
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        </div>
      </div>
    </header>
  );
}
