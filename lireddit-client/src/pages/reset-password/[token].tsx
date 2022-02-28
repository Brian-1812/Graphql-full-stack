import React, { useState } from "react";
import { NextPage } from "next";
import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { useResetPasswordMutation } from "../../generated/graphql";
import { useRouter } from "next/router";
import { toErrorMap } from "../../utils/toErrorMap";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../utils/createUrqlClient";

const ResetPassword: NextPage<{ token: string }> = ({ token }) => {
  const router = useRouter();
  const [, resetPassword] = useResetPasswordMutation();
  const [tokenError, setTokenError] = useState("");
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ newPassword: "" }}
        onSubmit={async (values, { setErrors }) => {
          const response = await resetPassword({
            newPassword: values.newPassword,
            token,
          });
          if (response.data?.resetPassword.errors) {
            const errorMap = toErrorMap(response.data.resetPassword.errors);
            if ("token" in errorMap) {
              setTokenError(errorMap.token);
            }
            setErrors(errorMap);
          } else if (response.data?.resetPassword.user) {
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              label="New Password"
              placeholder="New password"
            />
            {tokenError && <Box color="red">{tokenError}</Box>}
            <Button
              mt={4}
              colorScheme="teal"
              type="submit"
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ResetPassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ResetPassword);
