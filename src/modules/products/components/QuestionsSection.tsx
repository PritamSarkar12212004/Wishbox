import { useState, memo } from 'react';
import { MessageCircle, Send, ThumbsUp } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { FAQS } from '../data/productData';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function QuestionsSection() {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [helpfulCount, setHelpfulCount] = useState<Record<number, boolean>>({});

    const submitQuestion = () => {
        if (!question.trim()) {
            toast.error('Please type your question first');
            return;
        }
        toast.success('Question submitted', {
            description: 'Our team will answer within 24 hours. (Demo)',
        });
        setQuestion('');
        setOpen(false);
    };

    return (
        <section
            className="rounded-2xl border bg-white/60 p-5 md:p-7"
            style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.sm }}
            aria-label="Questions and answers"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: Theme.colors.text }}>
                    <MessageCircle size={18} style={{ color: Theme.colors.primaryDark }} />
                    Questions &amp; Answers
                </h2>
                <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                    <Send size={14} />
                    Ask a Question
                </Button>
            </div>

            <div className="mt-4 flex flex-col divide-y" style={{ borderColor: Theme.colors.border }}>
                {FAQS.map((faq) => {
                    const marked = helpfulCount[faq.id] ?? false;
                    return (
                        <article key={faq.id} className="py-4">
                            <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                                Q: {faq.question}
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: Theme.colors.textLight }}>
                                A: {faq.answer}
                            </p>
                            <button
                                type="button"
                                onClick={() => setHelpfulCount((prev) => ({ ...prev, [faq.id]: !marked }))}
                                aria-pressed={marked}
                                className="mt-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors hover:bg-black/5"
                                style={{ color: marked ? '#2E7D5B' : Theme.colors.textMuted }}
                            >
                                <ThumbsUp size={12} />
                                Helpful ({faq.helpful + (marked ? 1 : 0)})
                            </button>
                        </article>
                    );
                })}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ask a Question</DialogTitle>
                        <DialogDescription>
                            Ask anything about this product — our team usually replies within 24 hours.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label htmlFor="qa-question" className="text-xs font-medium" style={{ color: Theme.colors.textMuted }}>
                            Your question
                        </label>
                        <textarea
                            id="qa-question"
                            rows={4}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. Is this suitable for outdoor decoration?"
                            className="w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                            style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitQuestion}>
                            <Send size={14} />
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}

export default memo(QuestionsSection);