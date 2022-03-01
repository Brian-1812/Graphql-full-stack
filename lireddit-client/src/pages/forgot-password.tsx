import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

interface forgotPasswordProps {}

const ForgotPassword: React.FC<forgotPasswordProps> = ({}) => {
  const [submitted, setSubmitted] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      {submitted ? (
        <Box>
          If your email exists in our db we sent you an reset pasword email
        </Box>
      ) : (
        <Formik
          initialValues={{ email: "" }}
          onSubmit={async (values) => {
            await forgotPassword(values);
            setSubmitted(true);
            // if (response.data?.login.errors)
            //   setErrors(toErrorMap(response.data.login.errors));
            // else if (response.data?.login.user) {
            //   router.push("/");
            // }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField name="email" label="Email" placeholder="Email" />
              <Button
                mt={4}
                colorScheme="teal"
                type="submit"
                isLoading={isSubmitting}
              >
                Reset password
              </Button>
            </Form>
          )}
        </Formik>
      )}
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ForgotPassword);
