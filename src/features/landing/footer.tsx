export function Footer() {
  return (
    <footer className="border-t px-4 py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Slides Composer</p>
        <p>
          Propulsé par{" "}
          <a
            href="https://github.com/zarazhangrui/frontend-slides"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            frontend-slides
          </a>
        </p>
      </div>
    </footer>
  );
}
