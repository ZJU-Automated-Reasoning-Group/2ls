import React from 'react';

// Example C programs with different types of bugs
const examples = {
  'memory_leak': {
    name: 'Memory Leak Example',
    code: `#include <stdlib.h>

int main() {
  int *x = malloc(sizeof(int));
  *x = 10;
  
  // Memory leak: x is not freed before returning
  return 0;
}`,
    description: 'A simple example demonstrating a memory leak.'
  },
  'buffer_overflow': {
    name: 'Buffer Overflow Example',
    code: `#include <string.h>

int main() {
  char buffer[10];
  
  // Buffer overflow: copying 15 characters into a 10-character buffer
  strcpy(buffer, "This string is too long");
  
  return 0;
}`,
    description: 'A simple example demonstrating a buffer overflow.'
  },
  'null_pointer': {
    name: 'Null Pointer Dereference',
    code: `#include <stdlib.h>

int main() {
  int *ptr = NULL;
  
  // Null pointer dereference
  *ptr = 42;
  
  return 0;
}`,
    description: 'A simple example demonstrating a null pointer dereference.'
  },
  'integer_overflow': {
    name: 'Integer Overflow Example',
    code: `#include <stdio.h>
#include <limits.h>

int main() {
  int a = INT_MAX;
  
  // Integer overflow
  int b = a + 1;
  
  printf("%d\\n", b);
  return 0;
}`,
    description: 'A simple example demonstrating an integer overflow.'
  },
  'double_free': {
    name: 'Double Free Example',
    code: `#include <stdlib.h>

int main() {
  int *x = malloc(sizeof(int));
  *x = 10;
  
  free(x);
  // Double free: x is freed twice
  free(x);
  
  return 0;
}`,
    description: 'A simple example demonstrating a double free error.'
  },
  'use_after_free': {
    name: 'Use After Free Example',
    code: `#include <stdlib.h>
#include <stdio.h>

int main() {
  int *x = malloc(sizeof(int));
  *x = 10;
  
  free(x);
  
  // Use after free: x is used after being freed
  printf("%d\\n", *x);
  
  return 0;
}`,
    description: 'A simple example demonstrating a use-after-free error.'
  },
  'division_by_zero': {
    name: 'Division by Zero Example',
    code: `#include <stdio.h>

int main() {
  int a = 10;
  int b = 0;
  
  // Division by zero
  int c = a / b;
  
  printf("%d\\n", c);
  return 0;
}`,
    description: 'A simple example demonstrating a division by zero error.'
  },
  'circular_list': {
    name: 'Circular List Example',
    code: `#include <stdlib.h>

typedef struct node {
  int value;
  struct node *next;
} Node;

int main() {
  // Build a circular list
  Node *head = (Node*) malloc(sizeof(Node));
  head->value = 1;
  
  Node *second = (Node*) malloc(sizeof(Node));
  second->value = 2;
  
  Node *third = (Node*) malloc(sizeof(Node));
  third->value = 3;
  
  head->next = second;
  second->next = third;
  third->next = head; // Creates a cycle
  
  // Attempt to free the list - will cause issues
  Node *current = head;
  while (current != NULL) {
    Node *temp = current;
    current = current->next;
    free(temp);
  }
  
  return 0;
}`,
    description: 'An example demonstrating issues with a circular linked list.'
  }
};

const ExampleSelector = ({ onSelectExample }) => {
  const handleSelectExample = (key) => {
    onSelectExample(examples[key].code);
  };

  return (
    <div className="mb-4">
      <h5>Select an Example:</h5>
      <div className="d-flex flex-wrap">
        {Object.keys(examples).map((key) => (
          <button
            key={key}
            className="btn btn-outline-secondary example-btn"
            onClick={() => handleSelectExample(key)}
            title={examples[key].description}
          >
            {examples[key].name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExampleSelector; 