import { CodegenConfig } from '@graphql-codegen/cli'

const config = {
    // ...
    generates: {
        'src/graphql-definitions/definitions.d.ts': {
            plugins: ['typescript'],
            config: {
                enumsAsTypes: true
            }
        }
    }
}
export default config