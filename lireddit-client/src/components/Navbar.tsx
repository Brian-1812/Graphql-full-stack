import React from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = ({}) => {
  const [, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });

  let body = null;
  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2} color="#fff">
            Login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link href="/register" color="#fff">
            Register
          </Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button onClick={() => logout()} variant="link">
          Sign out
        </Button>
      </Flex>
    );
  }

  return (
    <Flex bg="tomato" p={4} position="sticky" zIndex={1} top={0}>
      <Box ml="auto">{body}</Box>
    </Flex>
  );
};

export default Navbar;
