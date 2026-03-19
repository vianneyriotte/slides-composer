import { requireSession } from "@/lib/auth/session";
import { getPresentation } from "@/features/editor/actions";
import { SlideEditor } from "@/features/editor/slide-editor";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPresentationPage({ params }: Props) {
  await requireSession();
  const { id } = await params;

  const pres = await getPresentation(id);
  if (!pres) notFound();

  const mode = pres.markdown ? "edit-markdown" : "edit-html";

  return (
    <SlideEditor
      mode={mode}
      initialData={{
        id: pres.id,
        title: pres.title,
        markdown: pres.markdown,
        presetId: pres.presetId,
        html: pres.html,
      }}
    />
  );
}
