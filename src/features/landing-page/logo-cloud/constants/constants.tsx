import { FaReact } from "react-icons/fa";
import { RiNextjsFill } from "react-icons/ri";
import {  SiPostgresql, SiPrisma, SiShadcnui } from "react-icons/si";
export const techStack = [
  {
    name: "React",
    logo: () => <FaReact className="h-12 w-auto dark:text-white text-black" />,
  },
  {
    name: "Next.js",
    logo: () => (
      <RiNextjsFill className="h-12 w-auto dark:text-white text-black" />
    ),
  },
  {
    name: "Postgresql",
    logo: () => (
      <SiPostgresql className="h-12 w-auto dark:text-white text-black" />
    ),
  },
  {
    name: "Prisma",
    logo: () => (
      <SiPrisma className="h-12 w-auto dark:text-white text-black" />
    ),
  },
  {
    name: "ShadCN UI",
    logo: () => (
      <SiShadcnui className="h-12 w-auto dark:text-white text-black" />
    ),
  },
];
