import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const interests = [
  'Technology', 'Programming', 'Gaming', 'Movies', 'Anime', 'Music', 'Sports',
  'Fitness', 'Books', 'Art', 'Business', 'Entrepreneurship', 'Travel', 'Food',
  'Fashion', 'Photography', 'Education', 'Career', 'Networking',
  'Personal Development', 'Church & Community'
];

const starters = [
  "What's something you've learned recently?",
  "What's one place you'd love to visit?",
  "What's a movie you could watch repeatedly?",
  "If you could instantly master one skill, what would it be?",
  "What's a project you're currently excited about?"
];

async function main() {
  await prisma.interest.createMany({ data: interests.map((name) => ({ name })), skipDuplicates: true });
  await prisma.conversationStarter.createMany({ data: starters.map((prompt) => ({ prompt })), skipDuplicates: true });
  console.log(`Seeded ${interests.length} interests and ${starters.length} conversation starters.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
