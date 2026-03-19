import { requireSession } from "@/lib/auth/session";
import { SlideEditor } from "@/features/editor/slide-editor";

export default async function NewPresentationPage() {
  await requireSession();
  return <SlideEditor />;
}
