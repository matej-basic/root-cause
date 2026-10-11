import { PrismaClient, Category, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedChallenge {
  slug: string;
  cveId: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  order: number;
  summary: string;
  description: string;
  // Published image students pull in the self-host docker-compose.
  image: string;
  // sha256 hex of the canonical flag, or null to validate per-run instead.
  // Raw flag strings never appear in this file.
  flagHash: string | null;
  // `dynamic`: students run the challenge locally and the flagger sidecar mints
  // a per-run flag (POST /challenges/:slug/run), so `submit` validates against
  // the user's Run flags instead of `flagHash`. A dynamic challenge with no run
  // for the user rejects submissions.
  dynamic?: boolean;
  // Whether the challenge shows up in the catalog. Off for ones not yet ready.
  active?: boolean;
}

const challenges: SeedChallenge[] = [
  {
    slug: 'zgrep-rce',
    cveId: 'CVE-2022-1271',
    title: 'zgrep arbitrary file write',
    category: Category.misc,
    difficulty: Difficulty.medium,
    points: 200,
    order: 1,
    summary: 'Confuse zgrep with a newline in a filename to overwrite files and reach command execution.',
    description: [
      '# zgrep arbitrary file write',
      '',
      'CVE-2022-1271 lives in `zgrep`, the helper that searches inside gzip archives. A filename that contains a newline character confuses zgrep\'s argument handling and lets an attacker steer it into overwriting files it was never meant to touch. When GNU `sed` is present as well, that file write turns into command execution. Any service that shells out to zgrep with a user-supplied filename inherits the bug.',
      '',
      'Find where the app passes a filename you control into zgrep, build a `.gz` name with an embedded newline, and use it to drop or overwrite a file that gets you execution. The public proof of concept constructs the malicious name with `printf`.',
      '',
      '## How to reach it',
      '',
      'Run the challenge locally with its docker-compose. The flagger sidecar writes your per-run flag into the container before it starts. The service speaks HTTP on port 8080.',
    ].join('\n'),
    image: 'matejbasic/cve-2022-1271:1.0',
    flagHash: null,
    dynamic: true,
  },
  {
    slug: 'sha3-overflow',
    cveId: 'CVE-2022-37454',
    title: 'SHA-3 buffer overflow',
    category: Category.crypto,
    difficulty: Difficulty.medium,
    points: 300,
    order: 2,
    summary: 'Overflow the _sha3 buffer in CPython 3.10 and earlier by hashing a very large input.',
    description: [
      '# SHA-3 buffer overflow',
      '',
      'CVE-2022-37454 is a buffer overflow in the `_sha3` C module shipped with CPython 3.10 and earlier. Feeding a hash object a very large amount of data (around 4 GB in a single `update`) overflows an internal length field and corrupts memory. The immediate effect is a SIGSEGV crash of the interpreter, and under the right conditions the corruption can be pushed further.',
      '',
      'The proof of concept creates a `sha3_224` object and calls `update` twice, once with a single byte and once with roughly 4 GB, so the combined length wraps. Your job is to drive the vulnerable service into that state.',
      '',
      '```python',
      'import hashlib',
      'h = hashlib.sha3_224()',
      'h.update(b"\\x00" * 1)',
      'h.update(b"\\x00" * 4294967295)',
      '```',
      '',
      '## How to reach it',
      '',
      'Run the challenge locally with its docker-compose. The flagger sidecar writes your per-run flag into the container before it starts. The service speaks HTTP on port 8080.',
    ].join('\n'),
    image: 'matejbasic/cve-2022-37454:1.0',
    flagHash: null,
    dynamic: true,
  },
  {
    slug: 'text4shell',
    cveId: 'CVE-2022-42889',
    title: 'Text4Shell RCE',
    category: Category.web,
    difficulty: Difficulty.medium,
    points: 300,
    order: 3,
    summary: 'Abuse Apache Commons Text string interpolation to run commands on the server.',
    description: [
      '# Text4Shell RCE',
      '',
      'CVE-2022-42889 is an interpolation flaw in Apache Commons Text, versions 1.5 through 1.9. The `StringSubstitutor` interpolator resolves lookups written as `${prefix:name}`, and the `script`, `dns`, and `url` prefixes do far more than substitute text. When attacker input reaches `StringSubstitutor.replace()`, a crafted `${script:...}` value runs arbitrary code.',
      '',
      'Find the request field that ends up in the interpolator and send a `script` lookup that executes a command. The engine depends on the JDK: Nashorn on older JDKs, JEXL on JDK 15 and newer.',
      '',
      '```',
      "${script:javascript:java.lang.Runtime.getRuntime().exec('...')}",
      '```',
      '',
      '## How to reach it',
      '',
      'Run the challenge locally with its docker-compose. The flagger sidecar writes your per-run flag into the container before it starts. The service speaks HTTP on port 8080.',
    ].join('\n'),
    image: 'matejbasic/cve-2022-42889:1.0',
    flagHash: null,
    dynamic: true,
  },
  {
    slug: 'spring4shell',
    cveId: 'CVE-2022-22965',
    title: 'Spring4Shell RCE',
    category: Category.web,
    difficulty: Difficulty.hard,
    points: 400,
    order: 4,
    summary: 'Reach RCE through Spring MVC data binding against a WAR deployment on Tomcat.',
    description: [
      '# Spring4Shell RCE',
      '',
      'CVE-2022-22965 is a remote code execution bug in Spring MVC data binding on JDK 9 and newer. By steering the object properties that Spring binds from request parameters, an attacker reaches the class loader and writes a file into the server. The exploit only works when the app runs as a WAR on Tomcat, which is exactly how this challenge is deployed. A default Spring Boot jar would not be vulnerable.',
      '',
      'The target is a small bakery blog. The vulnerable endpoint is a `POST` to `/blogposts/posts`. The common approach writes a web shell through the data-binding trick, then calls it to run commands. The flag sits where the vulnerability lets you read it.',
      '',
      '## How to reach it',
      '',
      'Run the challenge locally with its docker-compose. The flagger sidecar writes your per-run flag into the container before it starts. The app is at `http://localhost:8080/blogposts/`.',
    ].join('\n'),
    image: 'matejbasic/cve-2022-22965',
    flagHash: null,
    dynamic: true,
  },
  {
    slug: 'dirty-pipe',
    cveId: 'CVE-2022-0847',
    title: 'Dirty Pipe',
    category: Category.pwn,
    difficulty: Difficulty.hard,
    points: 500,
    order: 5,
    summary: 'Linux kernel Dirty Pipe local privilege escalation from a low-privileged SSH user to root.',
    description: [
      '# Dirty Pipe',
      '',
      'CVE-2022-0847, known as Dirty Pipe, is a local privilege escalation bug in the Linux kernel. A flaw in the pipe buffer handling lets an unprivileged user write into the page cache backing read-only files. Overwriting something like `/etc/passwd` or a root-owned binary opens a path to a root shell.',
      '',
      'This challenge drops you onto the target over SSH as a low-privileged user. The password for the `baker` account is known, so start there, then compile and run the kernel exploit on the box to escalate. The flag is readable once you are root.',
      '',
      '## How to reach it',
      '',
      'This is an SSH challenge, not an HTTP one. Log in as the `baker` user over SSH.',
    ].join('\n'),
    image: 'matejbasic/cve-2022-0847',
    // Still static and pending a kernel test on the self-host target, so it is
    // held out of the catalog until the per-run flag path is validated for it.
    flagHash: '6839bdcabc934ec34c6e46b9bee43d8373c2d71dc55a1d9ccfe9e22da4579e76',
    dynamic: false,
    active: false,
  },
];

async function main(): Promise<void> {
  for (const c of challenges) {
    const data = {
      cveId: c.cveId,
      title: c.title,
      category: c.category,
      difficulty: c.difficulty,
      points: c.points,
      order: c.order,
      summary: c.summary,
      description: c.description,
      image: c.image,
      flagHash: c.flagHash,
      dynamic: c.dynamic ?? false,
      active: c.active ?? true,
    };
    await prisma.challenge.upsert({
      where: { slug: c.slug },
      update: data,
      create: { slug: c.slug, ...data },
    });
    console.log(`upserted ${c.slug}`);
  }
  console.log(`Seeded ${challenges.length} challenges.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
