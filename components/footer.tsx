export function Footer() {
  return (
    <footer className="border-t bg-white/80 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-center px-4 md:px-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Proposal Generator App. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
