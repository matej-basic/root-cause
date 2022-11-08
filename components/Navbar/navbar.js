import Link from "next/link";
import { Container, Nav, Navbar } from "react-bootstrap";

function FLNavbar() {
  return (
    <Navbar bg="primary" variant="dark">
      <Container fluid>
        <Link href="/" passHref>
          <Navbar.Brand>Forwarding Labs</Navbar.Brand>
        </Link>
        <Navbar.Toggle aria-controls="navbarNav" />
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Link href="/home" passHref>
              <Nav.Link>Home</Nav.Link>
            </Link>
            <Link href="/challenges" passHref>
              <Nav.Link>Challenges</Nav.Link>
            </Link>
            <Link href="/leaderboard" passHref>
              <Nav.Link>Leaderboard</Nav.Link>
            </Link>
          </Nav>
          <Nav>
            <Link href="/register" passHref>
              <Nav.Link>Register</Nav.Link>
            </Link>
            <Link href="/login" passHref>
              <Nav.Link>Login</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default FLNavbar;
