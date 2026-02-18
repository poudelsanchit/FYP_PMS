import { type IconName } from "lucide-react/dynamic";

export interface FAQItem {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
}
