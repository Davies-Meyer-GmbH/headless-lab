# Canvas AI tools

Tool definitions as the model receives them: name, description, and parameters. Exported from headless-lab on 15 October 2026.

## `ai_agents::ai_agent::canvas_component_agent`

Used by: canvas_ai_orchestrator

```json
{
    "name": "canvas_component_agent",
    "description": "This agent can manipulate things in Drupal Canvas. Since it outputs a very specific JSON format, please do not use this in other contexts.",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "name": "prompt",
                "type": "string",
                "description": "Prompt The prompt in natural language on how to invoke this agent."
            },
            "files": {
                "name": "files",
                "type": "array",
                "description": "Files The files using file id.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "prompt"
        ]
    }
}
```

## `ai_agents::ai_agent::canvas_metadata_generation_agent`

Used by: canvas_ai_orchestrator

```json
{
    "name": "canvas_metadata_generation_agent",
    "description": "This agent focuses on generating metadata(meta description) for Drupal Canvas content, as well as for any user-provided content",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "name": "prompt",
                "type": "string",
                "description": "Prompt The prompt in natural language on how to invoke this agent."
            },
            "files": {
                "name": "files",
                "type": "array",
                "description": "Files The files using file id.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "prompt"
        ]
    }
}
```

## `ai_agents::ai_agent::canvas_page_builder_agent`

Used by: canvas_ai_orchestrator

```json
{
    "name": "canvas_page_builder_agent",
    "description": "This agent can insert one or many existing components or sections into a specific location on a page. Use this to place a previously created component or section on a layout or page.",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "name": "prompt",
                "type": "string",
                "description": "Prompt The prompt in natural language on how to invoke this agent."
            },
            "files": {
                "name": "files",
                "type": "array",
                "description": "Files The files using file id.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "prompt"
        ]
    }
}
```

## `ai_agents::ai_agent::canvas_template_builder_agent`

Used by: canvas_ai_orchestrator

```json
{
    "name": "canvas_template_builder_agent",
    "description": "This tool specializes in building the body of a complete web page by assembling available components into a cohesive layout in the content region. It should be used whenever the user requests to create an entire page. For example, “Create a landing page for a university website” or “Build a landing page template for a cookie shop”.",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "name": "prompt",
                "type": "string",
                "description": "Prompt The prompt in natural language on how to invoke this agent."
            },
            "files": {
                "name": "files",
                "type": "array",
                "description": "Files The files using file id.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "prompt"
        ]
    }
}
```

## `ai_agents::ai_agent::canvas_title_generation_agent`

Used by: canvas_ai_orchestrator

```json
{
    "name": "canvas_title_generation_agent",
    "description": "This agent focuses solely on generating new title and editing existing title for Drupal Canvas. It ensures that the created or edited title matches user-provided guidelines and specifications.",
    "parameters": {
        "type": "object",
        "properties": {
            "prompt": {
                "name": "prompt",
                "type": "string",
                "description": "Prompt The prompt in natural language on how to invoke this agent."
            },
            "files": {
                "name": "files",
                "type": "array",
                "description": "Files The files using file id.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "prompt"
        ]
    }
}
```

## `ai_agent:verify_task_completion`

Used by: canvas_ai_orchestrator

```json
{
    "name": "ai_agent_verify_task_completion",
    "description": "This tool MUST be called ONLY after invoking canvas_page_builder_agent or canvas_template_builder_agent to verify that title and metadata were properly generated if they were empty. DO NOT call this tool for any other operations including canvas_component_agent, general questions, or non-page-building tasks.",
    "parameters": {
        "type": "object"
    }
}
```

## `ai_agent:edit_component_js`

Used by: canvas_component_agent

```json
{
    "name": "ai_agent_edit_component_js",
    "description": "This method allows you to edit the javascript on components.",
    "parameters": {
        "type": "object",
        "properties": {
            "javascript": {
                "name": "javascript",
                "type": "string",
                "description": "Javascript All the new javascript that should replace the old one."
            },
            "props_metadata": {
                "name": "props_metadata",
                "type": "string",
                "description": "Props Metadata for props"
            },
            "slots_metadata": {
                "name": "slots_metadata",
                "type": "string",
                "description": "Slots Metadata for slots. A JSON array where each entry is an object with an 'id' (slot machine name), 'name' (human-readable title) and an optional 'example' (sample child markup)."
            },
            "component_machine_name": {
                "name": "component_machine_name",
                "type": "string",
                "description": "Component machine name The machine name of the component to edit."
            },
            "selected_component_required_props": {
                "name": "selected_component_required_props",
                "type": "array",
                "description": "Selected Component Required Props The existing required props of the selected component.",
                "items": {
                    "type": "string"
                }
            }
        },
        "required": [
            "javascript",
            "props_metadata",
            "component_machine_name"
        ]
    }
}
```

## `ai_agent:create_component`

Used by: canvas_component_agent

```json
{
    "name": "ai_agent_create_component",
    "description": "This method creates a new component.",
    "parameters": {
        "type": "object",
        "properties": {
            "component_name": {
                "name": "component_name",
                "type": "string",
                "description": "Component Name The data name of the component that we should create."
            },
            "js_structure": {
                "name": "js_structure",
                "type": "string",
                "description": "Javascript All the new javascript."
            },
            "css_structure": {
                "name": "css_structure",
                "type": "string",
                "description": "CSS All the new CSS."
            },
            "props_metadata": {
                "name": "props_metadata",
                "type": "string",
                "description": "Props Metadata for props"
            },
            "slots_metadata": {
                "name": "slots_metadata",
                "type": "string",
                "description": "Slots Metadata for slots. A JSON array where each entry is an object with an 'id' (slot machine name), 'name' (human-readable title) and an optional 'example' (sample child markup)."
            }
        },
        "required": [
            "component_name"
        ]
    }
}
```

## `ai_agent:get_props_type`

Used by: canvas_component_agent, canvas_component_agent (context, runs automatically)

```json
{
    "name": "ai_agent_get_props_type",
    "description": "This method gets the props type in Drupal Canvas.",
    "parameters": {
        "type": "object",
        "properties": {
            "derived_proptypes": {
                "name": "derived_proptypes",
                "type": "string",
                "description": "Prop Type The prop type for Drupal Canvas."
            }
        },
        "required": [
            "derived_proptypes"
        ]
    }
}
```

## `ai_agent:get_js_component`

Used by: canvas_component_agent

```json
{
    "name": "ai_agent_get_js_component",
    "description": "This method gets the javascript, css, props and slots for a JS component.",
    "parameters": {
        "type": "object",
        "properties": {
            "component_name": {
                "name": "component_name",
                "type": "string",
                "description": "Component Name The data name of the component that we should get the data for."
            }
        },
        "required": [
            "component_name"
        ]
    }
}
```

## `ai_agent:get_node_fields`

Used by: canvas_component_agent

```json
{
    "name": "ai_agent_get_node_fields",
    "description": "This method allows to get node fields.",
    "parameters": {
        "type": "object",
        "properties": {
            "node_type": {
                "name": "node_type",
                "type": "string",
                "description": "Node Type The node type for which you want to get fields."
            }
        },
        "required": [
            "node_type"
        ]
    }
}
```

## `ai_agent:add_metadata`

Used by: canvas_metadata_generation_agent

```json
{
    "name": "ai_agent_add_metadata",
    "description": "This method allows you to add the metatag description.",
    "parameters": {
        "type": "object",
        "properties": {
            "metadata": {
                "name": "metadata",
                "type": "string",
                "description": "Metadata All new metadata that should replace any existing metadata."
            }
        },
        "required": [
            "metadata"
        ]
    }
}
```

## `ai_agent:get_entity_information`

Used by: canvas_metadata_generation_agent (context, runs automatically), canvas_title_generation_agent (context, runs automatically)

```json
{
    "name": "ai_agent_get_entity_information",
    "description": "This method allows to get entity information.",
    "parameters": {
        "type": "object",
        "properties": {
            "entity_type": {
                "name": "entity_type",
                "type": "string",
                "description": "Entity Type The entity type for which you want to perform operations."
            },
            "entity_id": {
                "name": "entity_id",
                "type": "integer",
                "description": "Entity Id The entity id for which you want to perform operations."
            },
            "selected_component": {
                "name": "selected_component",
                "type": "string",
                "description": "Selected Component The selected component for which you want to perform operations."
            },
            "layout": {
                "name": "layout",
                "type": "string",
                "description": "Current Layout The current layout of the page."
            }
        }
    }
}
```

## `ai_agent:get_page_data`

Used by: canvas_metadata_generation_agent (context, runs automatically), canvas_title_generation_agent (context, runs automatically)

```json
{
    "name": "ai_agent_get_page_data",
    "description": "This method allows to get page data.",
    "parameters": {
        "type": "object",
        "properties": {
            "page_title": {
                "name": "page_title",
                "type": "string",
                "description": "Page Title The title of the page."
            },
            "page_description": {
                "name": "page_description",
                "type": "string",
                "description": "Page Description The description of the page."
            }
        }
    }
}
```

## `canvas_ai:set_component_structure`

Used by: canvas_page_builder_agent

```json
{
    "name": "set_component_structure",
    "description": "This is the tool that should be used to apply the component structure generated to the current page. The input should be a YAML string representing the component structure with operations. Components will not be added to the page unless this tool is called. It may also return errors if the structure is invalid.",
    "parameters": {
        "type": "object",
        "properties": {
            "component_structure": {
                "name": "component_structure",
                "type": "string",
                "description": "Component structure in yml format The component structure to store in YAML format."
            }
        },
        "required": [
            "component_structure"
        ]
    }
}
```

## `canvas_ai:get_current_layout`

Used by: canvas_page_builder_agent (context, runs automatically), canvas_template_builder_agent (context, runs automatically)

```json
{
    "name": "get_current_layout",
    "description": "Gets the current layout stored in the system.",
    "parameters": {
        "type": "object"
    }
}
```

## `canvas_ai:get_component_context`

Used by: canvas_page_builder_agent (context, runs automatically), canvas_template_builder_agent (context, runs automatically)

```json
{
    "name": "get_component_context",
    "description": "This method gets information about all available components in the site.",
    "parameters": {
        "type": "object",
        "properties": {
            "catalog_only": {
                "name": "catalog_only",
                "type": "boolean",
                "description": "Catalog only When set, only the id, name and description of each component is returned, without props and slots. Meant to be set from agent configuration for a cheap component overview; details can then be fetched per component with get_component_details."
            }
        }
    }
}
```

## `canvas_ai:set_template_data`

Used by: canvas_template_builder_agent

```json
{
    "name": "set_template_data",
    "description": "This tool is used to add components across various regions of the page to build the desired templates. The component structure must be provided in valid YAML format.",
    "parameters": {
        "type": "object",
        "properties": {
            "component_structure": {
                "name": "component_structure",
                "type": "string",
                "description": "Component structure in yml format The component structure to store in YAML format."
            }
        },
        "required": [
            "component_structure"
        ]
    }
}
```

## `ai_agent:create_field_content`

Used by: canvas_title_generation_agent

```json
{
    "name": "ai_agent_create_field_content",
    "description": "This method allows you to add the content on entity field.",
    "parameters": {
        "type": "object",
        "properties": {
            "field_content": {
                "name": "field_content",
                "type": "string",
                "description": "Content for the field. Content for the field."
            },
            "field_name": {
                "name": "field_name",
                "type": "string",
                "description": "Field Name The field provided by the user."
            }
        },
        "required": [
            "field_content",
            "field_name"
        ]
    }
}
```

## `ai_agent:edit_field_content`

Used by: canvas_title_generation_agent

```json
{
    "name": "ai_agent_edit_field_content",
    "description": "This method allows you to refine the content on entity field.",
    "parameters": {
        "type": "object",
        "properties": {
            "text_value": {
                "name": "text_value",
                "type": "string",
                "description": "Text All the new text that should replace the old one."
            },
            "field_name": {
                "name": "field_name",
                "type": "string",
                "description": "Field Name The field provided by the user."
            }
        },
        "required": [
            "text_value",
            "field_name"
        ]
    }
}
```
