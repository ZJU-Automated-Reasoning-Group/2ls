/*******************************************************************\

Module: Horn-clause Encoding

Author:

\*******************************************************************/

/// \file
/// Horn-clause Encoding

#ifndef CPROVER_2LS_2LS_HORN_ENCODING_H
#define CPROVER_2LS_2LS_HORN_ENCODING_H

#include <iosfwd>

#include <goto-programs/goto_model.h>

void horn_encoding(
  const goto_modelt &goto_model,
  dynamic_objectst &dynamic_objects,
  const optionst &options,
  std::ostream &out);

#endif
