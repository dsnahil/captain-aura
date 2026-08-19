import { ButtonLink } from "@/components/ui/button";
import { AuraMark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <AuraMark className="size-8 text-ember" />
      <h1 className="title mt-8">Nothing here.</h1>
      <p className="mt-4 max-w-xs text-sm text-pretty text-ink-faint">
        That page doesn&rsquo;t exist. Everything Captain Aura knows is still
        where you left it.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/home">Go home</ButtonLink>
        <ButtonLink href="/" variant="ghost">
          Landing page
        </ButtonLink>
      </div>
    </div>
  );
}
