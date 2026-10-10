import type { ChallengeDetail } from "./types";

// Built-in copy of the six seed challenges (see platform/API_CONTRACT.md).
// Used so the landing page and challenge pages still render real content when
// the API is cold, down, or unreachable. The live API is always preferred;
// this is only a fallback. Descriptions are drawn from each CVE-*/README.md and
// written for a student about to attempt the challenge, not as full exploits.

export const FALLBACK_CHALLENGES: ChallengeDetail[] = [
  {
    id: "fallback-erms-sqli",
    slug: "erms-sqli",
    title: "ERMS SQL injection auth bypass",
    cveId: "CVE-2021-44966",
    category: "web",
    difficulty: "easy",
    points: 100,
    order: 1,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "Bypass the login of a PHP employee-records app with a classic SQL injection and read what only an admin should see.",
    description: `## The bug

The Employee Record Management System 1.2 (PHPGurukul) builds its login query by pasting your input straight into SQL. The username field is never escaped, so a crafted value changes what the query *means* instead of just filling in a value.

## Reaching it

The login form lives at \`index.php\`. Send a username that closes the string and comments out the rest of the check, for example:

\`\`\`sql
marko' or 1=1#
\`\`\`

Once you are logged in as an administrator, browse the employee records. One employee's description holds what you came for.

## Note

This one runs from an external image, so automated flag submission may be turned off. Treat it as a close look at how a single unescaped field hands over an admin session.`,
  },
  {
    id: "fallback-dirty-pipe",
    slug: "dirty-pipe",
    title: "Dirty Pipe",
    cveId: "CVE-2022-0847",
    category: "pwn",
    difficulty: "hard",
    points: 500,
    order: 2,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "Abuse a Linux kernel page-cache flaw to overwrite a file you should only be able to read, then escalate to root.",
    description: `## The bug

Dirty Pipe (CVE-2022-0847) is a flaw in how the Linux kernel manages pipe buffers. A missing flag reset lets an unprivileged user push bytes into the page cache of a file they can only read. The write skips the usual permission check, so read-only files such as \`/etc/passwd\` can be rewritten in memory and trusted by the system.

## Reaching it

You get an SSH shell as the low-privileged user \`baker\`. The host runs a kernel in the vulnerable range. Compile the provided C exploit on the target, point it at a root-owned file, and use the overwrite to hand yourself an elevated shell.

The flag is waiting once you are root.`,
  },
  {
    id: "fallback-zgrep-rce",
    slug: "zgrep-rce",
    title: "zgrep arbitrary file write",
    cveId: "CVE-2022-1271",
    category: "misc",
    difficulty: "medium",
    points: 200,
    order: 3,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "A newline in a filename confuses zgrep into running your commands. Turn an archive search into code execution.",
    description: `## The bug

CVE-2022-1271 lives in \`zgrep\`, the helper that searches inside gzip archives. When a filename contains a newline, zgrep mishandles it and can be tricked into writing files it was never meant to touch. With GNU \`sed\` present, that file write becomes command execution.

## Reaching it

The app calls out to \`zgrep\` with a filename you control and does not sanitize it. Craft an archive whose name carries a newline and an embedded command, then let the search run over it:

\`\`\`bash
echo foo | gzip > "$(printf '|\\n;e <your-command>\\n#.gz')"
\`\`\`

When zgrep processes that name, your command runs. Use it to read the flag off the filesystem.`,
  },
  {
    id: "fallback-spring4shell",
    slug: "spring4shell",
    title: "Spring4Shell RCE",
    cveId: "CVE-2022-22965",
    category: "web",
    difficulty: "hard",
    points: 400,
    order: 4,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "Exploit Spring's data binding on a WAR-deployed app to drop a web shell and run commands on the server.",
    description: `## The bug

A Spring MVC application on JDK 9+ can be driven into remote code execution through data binding. By binding specially named request parameters, an attacker reaches \`class.module.classLoader\` and rewrites Tomcat's logging properties. The catch is that it only works when the app is deployed as a WAR on Tomcat, which is exactly how this challenge ships. A default Spring Boot jar would not be exploitable.

## Reaching it

The site is a small bakery blog on port 8080. The vulnerable endpoint is a POST to \`/blogposts/posts\`. Use the data-binding trick to write a JSP web shell into a web-reachable directory, then call that shell to execute commands.

The flag is at \`/root/flag.txt\`.`,
  },
  {
    id: "fallback-sha3-overflow",
    slug: "sha3-overflow",
    title: "SHA-3 buffer overflow",
    cveId: "CVE-2022-37454",
    category: "crypto",
    difficulty: "medium",
    points: 300,
    order: 5,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "Feed a huge input to Python's SHA-3 implementation and trip a buffer overflow in the _sha3 module.",
    description: `## The bug

CVE-2022-37454 is a buffer overflow in the \`_sha3\` module used by Python 3.10 and earlier. Hashing a very large input (around 4 GB in one go) overflows an internal length field and corrupts memory, which at minimum crashes the process with a SIGSEGV and can be pushed further.

## Reaching it

The service hashes data you supply with SHA-3. Send input past the overflow threshold, for example by updating the hash with one tiny chunk and then one enormous chunk:

\`\`\`python
import hashlib
h = hashlib.sha3_224()
h.update(b"\\x00" * 1)
h.update(b"\\x00" * 4294967295)
\`\`\`

Reproduce the overflow against the running target to earn the flag.`,
  },
  {
    id: "fallback-text4shell",
    slug: "text4shell",
    title: "Text4Shell RCE",
    cveId: "CVE-2022-42889",
    category: "web",
    difficulty: "medium",
    points: 300,
    order: 6,
    active: true,
    solveCount: 0,
    solved: false,
    summary:
      "Smuggle a ${script:...} lookup into Apache Commons Text and make the interpolator execute your payload.",
    description: `## The bug

Apache Commons Text 1.5 through 1.9 ships a \`StringSubstitutor\` interpolator that resolves lookups written as \`\${prefix:name}\`. Three of those prefixes are dangerous: \`script\`, \`dns\`, and \`url\`. When attacker-controlled input reaches \`replace()\` or \`replaceIn()\`, a \`script\` lookup runs arbitrary code.

## Reaching it

The app passes your input through the interpolator. Depending on the JDK, a \`script\` lookup via Nashorn or JEXL executes a command, for example:

\`\`\`text
\${script:javascript:java.lang.Runtime.getRuntime().exec('<your-command>')}
\`\`\`

Use the lookup to run a command on the server and retrieve the flag.`,
  },
];

export const FALLBACK_CHALLENGE_BY_SLUG: Record<string, ChallengeDetail> =
  Object.fromEntries(FALLBACK_CHALLENGES.map((c) => [c.slug, c]));
