import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"

interface RichTextDisplayProps {
    content: string
    className?: string
    truncate?: boolean
    maxLines?: number
}

export default function RichTextDisplay({
    content,
    className,
    truncate = false,
    maxLines = 3
}: RichTextDisplayProps) {
    if (!content) return null

    const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "a", "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li", "blockquote", "pre", "code", "img", "table", "thead", "tbody",
            "tr", "th", "td", "div", "span", "hr"],
        ALLOWED_ATTR: ["href", "src", "alt", "className", "title", "target", "rel"],
    })

    const styles = `
    prose dark:prose-invert max-w-none break-words [&_*]:max-w-full
    prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0
    prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-6
    prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4
    prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4
    prose-li:mb-2
    prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
    prose-img:rounded-xl prose-img:shadow-md
    ${truncate ? `overflow-hidden text-ellipsis` : ''}
  `

    const truncateStyles = truncate ? {
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical' as const,
    } : {}

    return (
        <div
            className={cn(styles, className)}
            style={truncateStyles}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    )
}
