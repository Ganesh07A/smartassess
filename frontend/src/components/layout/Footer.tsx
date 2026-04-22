import { Container } from "../ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-12 text-center text-gray-500 text-sm">
      <Container>
        <p>© {new Date().getFullYear()} SmartAssess. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-black transition">Terms</a>
          <a href="#" className="hover:text-black transition">Privacy Policy</a>
          <a href="#" className="hover:text-black transition">Contact</a>
        </div>
      </Container>
    </footer>
  );
}
