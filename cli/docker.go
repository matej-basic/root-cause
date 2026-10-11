package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// projectName is the compose project name for a challenge. The rootcause-
// prefix lets `status` recognize instances this CLI started.
func projectName(slug string) string {
	return "rootcause-" + slug
}

// dockerAvailable reports whether the docker binary is on PATH.
func dockerAvailable() bool {
	_, err := exec.LookPath("docker")
	return err == nil
}

// runCompose runs `docker compose` with the given arguments, streaming stdio
// straight through so the user sees build and run output live. It returns the
// command's exit code (0 on success).
func runCompose(args ...string) (int, error) {
	if !dockerAvailable() {
		return 1, fmt.Errorf("docker not found on PATH; install Docker to run challenges")
	}
	full := append([]string{"compose"}, args...)
	cmd := exec.Command("docker", full...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return exitErr.ExitCode(), nil
		}
		return 1, err
	}
	return 0, nil
}

// composeUp starts a challenge in the foreground, streaming output.
func composeUp(composePath, envPath, slug string) (int, error) {
	return runCompose(
		"-f", composePath,
		"--env-file", envPath,
		"-p", projectName(slug),
		"up",
	)
}

// composeDown tears a challenge down.
func composeDown(composePath, slug string) (int, error) {
	return runCompose(
		"-f", composePath,
		"-p", projectName(slug),
		"down",
	)
}

// dockerStatus is a best-effort listing of running rootcause compose projects.
// It prefers `docker compose ls` and falls back to `docker ps` filtered on the
// compose project label.
func dockerStatus() error {
	if !dockerAvailable() {
		return fmt.Errorf("docker not found on PATH")
	}

	var out bytes.Buffer
	cmd := exec.Command("docker", "compose", "ls")
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err == nil {
		lines := strings.Split(strings.TrimRight(out.String(), "\n"), "\n")
		printed := false
		for i, line := range lines {
			// Keep the header row plus any rootcause- project.
			if i == 0 || strings.Contains(line, "rootcause-") {
				fmt.Println(line)
				if i > 0 {
					printed = true
				}
			}
		}
		if !printed {
			fmt.Println("(no running rootcause challenges)")
		}
		return nil
	}

	// Fallback: list containers by compose project label.
	ps := exec.Command("docker", "ps",
		"--filter", "label=com.docker.compose.project",
		"--format", "{{.Label \"com.docker.compose.project\"}}\t{{.Names}}\t{{.Status}}")
	psOut, err := ps.Output()
	if err != nil {
		return fmt.Errorf("docker status failed: %w", err)
	}
	found := false
	for _, line := range strings.Split(strings.TrimRight(string(psOut), "\n"), "\n") {
		if strings.HasPrefix(line, "rootcause-") {
			fmt.Println(line)
			found = true
		}
	}
	if !found {
		fmt.Println("(no running rootcause challenges)")
	}
	return nil
}
