// src/app/(main)/create-card/page.jsx
import Container from '@/components/layout/Container';
import CreateCardForm from './_components/CreateCardForm';

export default function CreateCardPage() {
  return (
    <Container>
      <section className="w-full min-w-0 overflow-x-hidden pt-[50px] max-w-[1400px]">
        <h1 className="text-[28px] font-bold min-[500px]:text-4xl">포토카드 생성</h1>
        <div className="mt-6 h-px w-full bg-white/20" />
        <CreateCardForm />
      </section>
    </Container>
  );
}
