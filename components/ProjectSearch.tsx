"use client";

import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import cn from "clsx";
import { addBasePath } from "next/dist/client/add-base-path";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
	Fragment,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Badge } from "./ui/badge";

declare global {
	interface Window {
		pagefind: {
			options: (opts: Record<string, unknown>) => Promise<void>;
			debouncedSearch: (
				query: string,
				options?: { filters?: Record<string, string[]> },
			) => Promise<{
				results: { data: () => Promise<PagefindResult> }[];
			} | null>;
		};
	}
}

interface PagefindSubResult {
	title: string;
	url: string;
	excerpt: string;
}

interface PagefindResult {
	url: string;
	meta: {
		title: string;
		projectName?: string;
		projectId?: string;
	};
	sub_results: PagefindSubResult[];
}

async function importPagefind() {
	window.pagefind = await import(
		/* webpackIgnore: true */
		addBasePath("/_pagefind/pagefind.js")
	);
	await window.pagefind.options({
		baseUrl: "/",
	});
}

const INPUTS = new Set(["INPUT", "SELECT", "BUTTON", "TEXTAREA"]);

function useMounted() {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}

interface ProjectBadgeProps {
	projectName: string;
}

function ProjectBadge({ projectName }: ProjectBadgeProps) {
	return (
		<Badge variant={"default"} className="mr-4">
			{projectName}
		</Badge>
	);
}

interface ResultProps {
	data: PagefindResult;
	showBadge: boolean;
}

function Result({ data, showBadge }: ResultProps) {
	const titleClassName = cn(
		"x:mx-2.5 x:mb-2 x:not-first:mt-6 x:select-none x:border-b x:border-black/10",
		"x:px-2.5 x:pb-1.5 x:text-xs x:font-semibold x:uppercase x:text-gray-600",
		"x:dark:border-white/20 x:dark:text-gray-300",
		"x:contrast-more:border-gray-600 x:contrast-more:text-gray-900",
		"x:contrast-more:dark:border-gray-50 x:contrast-more:dark:text-gray-50",
	);

	return (
		<Fragment>
			<div className={titleClassName}>
				{showBadge && data.meta.projectName && (
					<ProjectBadge projectName={data.meta.projectName} />
				)}
				{data.meta.title}
			</div>
			{data.sub_results.map((subResult) => {
				const url = subResult.url
					.replace(/\.html$/, "")
					.replace(/\.html#/, "#");
				return (
					<ComboboxOption
						key={url}
						as={NextLink}
						value={{ ...subResult, url }}
						href={url}
						className={({ focus }: { focus: boolean }) =>
							cn(
								"x:mx-2.5 x:break-words x:rounded-md x:contrast-more:border",
								focus
									? "x:text-primary-600 x:contrast-more:border-current x:bg-primary-500/10"
									: "x:text-gray-800 x:dark:text-gray-300 x:contrast-more:border-transparent",
								"x:block x:scroll-m-12 x:px-2.5 x:py-2",
							)
						}
					>
						<div className="x:text-base x:font-semibold x:leading-5">
							{subResult.title}
						</div>
						<div
							className={cn(
								"x:mt-1 x:text-sm x:leading-[1.35rem] x:text-gray-600",
								"x:dark:text-gray-400 x:contrast-more:dark:text-gray-50",
								"x:[&_mark]:bg-primary-600/80 x:[&_mark]:text-white",
							)}
							dangerouslySetInnerHTML={{ __html: subResult.excerpt }}
						/>
					</ComboboxOption>
				);
			})}
		</Fragment>
	);
}

interface SpinnerIconProps {
	height: string;
	className?: string;
}

function SpinnerIcon({ height, className }: SpinnerIconProps) {
	return (
		<svg
			className={className}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
			<path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
		</svg>
	);
}

interface InfoIconProps {
	height: string;
	className?: string;
}

function InfoIcon({ height, className }: InfoIconProps) {
	return (
		<svg
			className={className}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4M12 8h.01" />
		</svg>
	);
}

export function ProjectSearch() {
	const pathname = usePathname();
	const router = useRouter();
	const mounted = useMounted();
	const inputRef = useRef<HTMLInputElement>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<React.ReactNode>("");
	const [results, setResults] = useState<PagefindResult[]>([]);
	const [search, setSearch] = useState("");
	const [focused, setFocused] = useState(false);

	const deferredSearch = useDeferredValue(search);

	// Extract project from URL: /nanocoder/docs/...
	const currentProject = useMemo(() => {
		const match = pathname.match(/^\/([^/]+)\/docs\//);
		return match ? match[1] : null;
	}, [pathname]);

	const searchOptions = useMemo(() => {
		if (!currentProject) return undefined;
		return {
			filters: { project: [currentProject] },
		};
	}, [currentProject]);

	// Show badges when not filtering by project (global search)
	const showBadges = !currentProject;

	useEffect(() => {
		const handleSearch = async (value: string) => {
			if (!value) {
				setResults([]);
				setError("");
				return;
			}
			setIsLoading(true);

			if (!window.pagefind) {
				try {
					await importPagefind();
				} catch (err) {
					const message =
						err instanceof Error
							? process.env.NODE_ENV !== "production" &&
								err.message.includes("Failed to fetch")
								? "Search isn't available in development. Run `next build` first."
								: `${err.constructor.name}: ${err.message}`
							: String(err);
					setError(message);
					setIsLoading(false);
					return;
				}
			}

			const response = await window.pagefind.debouncedSearch(
				value,
				searchOptions,
			);
			if (!response) return;

			const data = await Promise.all(response.results.map((o) => o.data()));
			setIsLoading(false);
			setError("");
			setResults(data);
		};

		handleSearch(deferredSearch);
	}, [deferredSearch, searchOptions]);

	// Keyboard shortcut: / or Ctrl+K / Cmd+K
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const el = document.activeElement;
			if (
				!el ||
				INPUTS.has(el.tagName) ||
				(el as HTMLElement).isContentEditable
			) {
				return;
			}
			if (
				event.key === "/" ||
				(event.key === "k" &&
					!event.shiftKey &&
					(navigator.userAgent.includes("Mac") ? event.metaKey : event.ctrlKey))
			) {
				event.preventDefault();
				inputRef.current?.focus({ preventScroll: true });
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleFocus = (event: React.FocusEvent) => {
		setFocused(event.type === "focus");
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(event.currentTarget.value);
	};

	const handleSelect = (
		searchResult: (PagefindSubResult & { url: string }) | null,
	) => {
		if (!searchResult) return;
		inputRef.current?.blur();

		const [url, hash] = searchResult.url.split("#");
		const isSamePathname = location.pathname === url;

		if (isSamePathname) {
			location.href = `#${hash}`;
		} else {
			router.push(searchResult.url);
		}
		setSearch("");
	};

	const shortcut = (
		<kbd
			className={cn(
				"x:absolute x:my-1.5 x:select-none x:pointer-events-none x:end-1.5 x:transition-all",
				"x:h-5 x:rounded x:bg-nextra-bg x:px-1.5 x:font-mono x:text-[11px] x:font-medium",
				"x:text-gray-600 x:dark:text-gray-400",
				"x:border nextra-border x:contrast-more:text-current",
				"x:items-center x:gap-1 x:flex x:max-sm:hidden not-prose",
				(!mounted || focused) && "x:invisible x:opacity-0",
			)}
		>
			{mounted && navigator.userAgent.includes("Mac") ? (
				<>
					<span className="x:text-xs">⌘</span>K
				</>
			) : (
				"CTRL K"
			)}
		</kbd>
	);

	const placeholder = currentProject
		? `Search ${currentProject}...`
		: "Search...";

	return (
		<Combobox onChange={handleSelect}>
			<div
				className={cn(
					"nextra-search",
					"x:relative x:flex x:items-center",
					"x:text-gray-900 x:dark:text-gray-300",
					"x:contrast-more:text-gray-800 x:contrast-more:dark:text-gray-300",
				)}
			>
				<ComboboxInput
					ref={inputRef}
					spellCheck={false}
					autoComplete="off"
					type="search"
					className={({ focus }: { focus: boolean }) =>
						cn(
							"x:rounded-lg x:px-3 x:py-2 x:transition-all",
							"x:w-full x:md:w-64",
							"x:text-base x:leading-tight x:md:text-sm",
							focus
								? "x:bg-transparent x:nextra-focus"
								: "x:bg-black/[.05] x:dark:bg-gray-50/10",
							"x:placeholder:text-gray-600 x:dark:placeholder:text-gray-400",
							"x:contrast-more:border x:contrast-more:border-current",
							"x:[&::-webkit-search-cancel-button]:appearance-none",
						)
					}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleFocus}
					value={search}
					placeholder={placeholder}
				/>
				{shortcut}
			</div>

			<ComboboxOptions
				transition
				anchor={{ to: "top end", gap: 10, padding: 16 }}
				className={cn(
					"nextra-search-results nextra-scrollbar x:max-md:h-full",
					"x:border x:border-gray-200 x:text-gray-100 x:dark:border-neutral-800",
					"x:z-30 x:rounded-xl x:py-2.5 x:shadow-xl",
					"x:contrast-more:border x:contrast-more:border-gray-900 x:contrast-more:dark:border-gray-50",
					"x:backdrop-blur-md x:bg-nextra-bg/70",
					"x:motion-reduce:transition-none",
					"x:origin-top x:transition x:duration-200 x:ease-out x:data-closed:scale-95 x:data-closed:opacity-0 x:empty:invisible",
					error || isLoading || !results.length
						? [
								"x:md:min-h-28 x:grow x:flex x:justify-center x:text-sm x:gap-2 x:px-8",
								error
									? "x:text-red-500 x:items-start"
									: "x:text-gray-400 x:items-center",
							]
						: "x:md:max-h-[min(calc(100vh-5rem),400px)]!",
					"x:w-full x:md:w-[576px]",
				)}
			>
				{error ? (
					<>
						<InfoIcon height="1.25em" className="x:shrink-0" />
						<div className="x:grid">
							<b className="x:mb-2">Failed to load search index.</b>
							{error}
						</div>
					</>
				) : isLoading ? (
					<>
						<SpinnerIcon height="20" className="x:shrink-0 x:animate-spin" />
						Loading…
					</>
				) : results.length ? (
					results.map((result) => (
						<Result key={result.url} data={result} showBadge={showBadges} />
					))
				) : (
					deferredSearch && "No results found."
				)}
			</ComboboxOptions>
		</Combobox>
	);
}
